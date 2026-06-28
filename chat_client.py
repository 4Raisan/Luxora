import asyncio
import websockets
import json
import sys

async def listen_for_messages(websocket):
    """Continuously listens for messages coming from the server."""
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                print("\n[!] Received invalid message from server")
                continue
            msg_type = data.get("type")

            if msg_type == "error":
                print(f"\n[Server Error] {data.get('message', 'Unknown error')}")
            elif msg_type == "history":
                print("\n--- Last 5 Messages ---")
                for msg in data.get("messages", []):
                    print(msg)
                print("-----------------------\n")
            elif msg_type == "broadcast":
                sys.stdout.write(f"\r{data.get('message')}\n> ")
                sys.stdout.flush()
                
    except websockets.exceptions.ConnectionClosed:
        print("\n[!] Connection to the server was closed.")
        sys.exit(0)

async def user_input_loop(websocket, room_name):
    """Handles taking input from the user without blocking the event loop."""
    loop = asyncio.get_running_loop()
    
    while True:
        # Run input() in a separate thread to prevent blocking WebSocket listening
        message_content = await loop.run_in_executor(None, input, "> ")
        
        if message_content.lower() in ['exit', 'quit']:
            print("Leaving chat...")
            break
            
        if message_content.strip():
            payload = {
                "type": "message",
                "room": room_name,
                "content": message_content
            }
            await websocket.send(json.dumps(payload))

async def main():
    uri = "ws://localhost:2024"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to the Chat Server!")
            
            # --- LOGIN PHASE ---
            while True:
                username = input("Enter your username: ")
                await websocket.send(json.dumps({"type": "login", "username": username}))
                
                response = await websocket.recv()
                try:
                    response_data = json.loads(response)
                except json.JSONDecodeError:
                    print("[!] Received invalid response from server. Try again.")
                    continue
                
                if response_data.get("status") == "accepted":
                    print(f"Login successful. Welcome, {username}!")
                    break
                else:
                    print(f"Login failed: {response_data.get('message')}. Try again.")

            # --- JOIN ROOM PHASE ---
            room_name = input("Enter chat room to join (e.g., sports, technology): ")
            await websocket.send(json.dumps({"type": "join", "room": room_name}))
            print(f"Joined room '{room_name}'. You can start typing messages! (Type 'exit' to quit)")
            
            # Start background task to listen for incoming messages
            listener_task = asyncio.create_task(listen_for_messages(websocket))
            
            # Start loop for user input
            await user_input_loop(websocket, room_name)

            # Clean up
            listener_task.cancel()
            
    except ConnectionRefusedError:
        print("[!] Could not connect to the server. Make sure server.py is running on port 2024.")
    except websockets.exceptions.ConnectionClosed:
        print("[!] Lost connection to the server.")
    except Exception as e:
        print(f"[!] Unexpected error: {e}")

if __name__ == "__main__":
    # Windows specific fix for asyncio
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(main())