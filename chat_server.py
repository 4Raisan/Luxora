import asyncio
import websockets
import json
import os
import re
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chat_logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Data Structures (Part C3)
# Dictionary to store active users: {websocket: "username"}
connected_users = {}

# Dictionary of sets for Pub-Sub chat rooms: {"room_name": {websocket1, websocket2}}
rooms = {}

def sanitize_room_name(room_name):
    """Sanitize room name to prevent path traversal."""
    safe = re.sub(r'[^a-zA-Z0-9_\-]', '', room_name)
    return safe[:64] if safe else 'default'

# Step 4: Message Logging
def save_message_to_log(room_name, message):
    """Appends a message to the room's log file."""
    safe_name = sanitize_room_name(room_name)
    filename = os.path.join(LOG_DIR, f"{safe_name}.txt")
    with open(filename, "a", encoding="utf-8") as file:
        file.write(message + "\n")

# Step 5: Late Joiner Message History
def get_message_history(room_name, count=5):
    """Retrieves the last 'count' messages from the room's log file."""
    safe_name = sanitize_room_name(room_name)
    filename = os.path.join(LOG_DIR, f"{safe_name}.txt")
    if not os.path.exists(filename):
        return []
    
    with open(filename, "r", encoding="utf-8") as file:
        lines = file.readlines()
        # Return the last 5 messages, stripped of newline characters
        return [line.strip() for line in lines[-count:]]

# Step 1: Server Setup
async def handle_client(websocket):
    """Handles the WebSocket connection for a single client."""
    current_username = None
    current_room = None

    try:
        # Step 2: User Login System
        async for message in websocket:
            data = json.loads(message)
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
                room_name = sanitize_room_name(data.get("room", ""))
                if not room_name:
                    await websocket.send(json.dumps({"type": "error", "message": "Invalid room name."}))
                    continue
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
                room_name = sanitize_room_name(data.get("room", ""))
                content = data.get("content", "")[:2000]  # Limit message length
                
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
                    # Fire and forget broadcast so we don't block cleanup
                    asyncio.create_task(broadcast_to_room(room_name, leave_msg))

async def broadcast_to_room(room_name, message):
    """Sends a message to all connected clients (subscribers) in a specific room."""
    if room_name in rooms:
        subscribers = rooms[room_name]
        if subscribers:
            payload = json.dumps({"type": "broadcast", "message": message})
            # Send to all subscribers concurrently
            await asyncio.gather(*[client.send(payload) for client in subscribers])

async def main():
    # Start the server on port 2024
    print("[SERVER] Starting Chat Manager on ws://localhost:2024...")
    async with websockets.serve(handle_client, "localhost", 2024):
        # Keep the server running indefinitely
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())