#!/bin/bash

osascript <<EOF
tell application "iTerm2"
    activate

    set win to (create window with default profile)
    tell current session of win
        write text "cd /Users/lorenzo/Documents/iris && source venv/bin/activate && cd backend && python3 app.py"
    end tell

    tell win
        set tab2 to create tab with default profile
        tell current session of tab2
            write text "cd /Users/lorenzo/Documents/iris/frontend && npm run dev"
        end tell
    end tell
end tell
EOF
sleep 5

open -a "Firefox" http://localhost:5173
