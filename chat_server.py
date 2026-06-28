import asyncio
import websockets
import json
import os
from datetime import datetime

# Data Structures (Part C3)
# Dictionary to store active users: {websocket: "username"}
connected_users = {}

# Dictionary of sets for Pub-Sub chat rooms: {"room_name": {websocket1, websocket2}}
rooms = {}

# Step 4: Message Logging
def save_message_to_log(room_name, message):
    """Appends a message to the room's log file."""
    filename = f"{room_name}.txt"
    try:
        with open(filename, "a", encoding="utf-8") as file:
            file.write(message + "\n")
    except OSError as e:
        print(f"[SERVER] Failed to write to log file '{filename}': {e}")

# Step 5: Late Joiner Message History
def get_message_history(room_name, count=5):
    """Retrieves the last 'count' messages from the room's log file."""
    filename = f"{room_name}.txt"
    if not os.path.exists(filename):
        return []
    
    try:
        with open(filename, "r", encoding="utf-8") as file:
            lines = file.readlines()
            return [line.strip() for line in lines[-count:]]
    except OSError as e:
        print(f"[SERVER] Failed to read log file '{filename}': {e}")
        return []

# Step 1: Server Setup
async def handle_client(websocket):
    """Handles the WebSocket connection for a single client."""
    current_username = None
    current_room = None

    try:
        # Step 2: User Login System
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                await websocket.send(json.dumps({"type": "error", "message": "Invalid JSON message"}))
                continue
            action = data.get("type")

            if action == "login":
                username = data.get("username")
                # Check for duplicate usernames
                if username in connected_users.values():
                    await websocket.send(json.dumps({"type": "login_response", "status": "rejected", "message": "Username already exists."}))
                else:
                    connected_users[websocket] = username
                    current_username = username
                    await websocket.send(json.dumps({"type": "login_response", "status": "accepted"}))
                    print(f"[SERVER] User '{username}' connected.")

            elif action == "join":
                # Step 3: Chat Room System (Pub-Sub Broker logic)
                room_name = data.get("room")
                current_room = room_name
                
                # Create room if it doesn't exist
                if room_name not in rooms:
                    rooms[room_name] = set()
                
                # Add subscriber to room
                rooms[room_name].add(websocket)
                print(f"[SERVER] '{current_username}' joined room '{room_name}'.")

                # Send message history to the late joiner
                history = get_message_history(room_name)
                await websocket.send(json.dumps({"type": "history", "messages": history}))

                # Notify others in the room
                join_msg = f"[SERVER] {current_username} has joined the room."
                await broadcast_to_room(room_name, join_msg)

            elif action == "message":
                room_name = data.get("room")
                content = data.get("content")
                
                # Format message with timestamp
                timestamp = datetime.now().strftime("%H:%M")
                formatted_message = f"[{timestamp}] {current_username}: {content}"
                
                # Save to file and broadcast (Pub-Sub implementation)
                save_message_to_log(room_name, formatted_message)
                await broadcast_to_room(room_name, formatted_message)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Cleanup when client disconnects
        if websocket in connected_users:
            username = connected_users.pop(websocket)
            print(f"[SERVER] User '{username}' disconnected.")
            
            # Remove from any room they were in
            for room_name, subscribers in rooms.items():
                if websocket in subscribers:
                    subscribers.remove(websocket)
                    leave_msg = f"[SERVER] {username} has left the room."
                    async def _safe_broadcast(rn, msg):
                        try:
                            await broadcast_to_room(rn, msg)
                        except Exception as e:
                            print(f"[SERVER] Failed to broadcast leave message in '{rn}': {e}")
                    asyncio.create_task(_safe_broadcast(room_name, leave_msg))

async def broadcast_to_room(room_name, message):
    """Sends a message to all connected clients (subscribers) in a specific room."""
    if room_name in rooms:
        subscribers = list(rooms[room_name])
        if subscribers:
            payload = json.dumps({"type": "broadcast", "message": message})
            results = await asyncio.gather(
                *[client.send(payload) for client in subscribers],
                return_exceptions=True
            )
            for client, result in zip(subscribers, results):
                if isinstance(result, Exception):
                    rooms[room_name].discard(client)
                    print(f"[SERVER] Removed disconnected client from '{room_name}'")

async def main():
    # Start the server on port 2024
    print("[SERVER] Starting Chat Manager on ws://localhost:2024...")
    async with websockets.serve(handle_client, "localhost", 2024):
        # Keep the server running indefinitely
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())