#!/usr/bin/env bash
# Linux app under WSLg: start (it should come up fullscreen), enter the game, show the F3 overlay, keep running.
export DISPLAY=:0 GDK_BACKEND=x11
rm -rf "$HOME/.local/share/com.pixeldebh.retrorescue"
"$HOME/pixeldebh-build/src-tauri/target/release/pixeldebh" > /tmp/pixeldebh.log 2>&1 &
PID=$!
sleep 9
W=$(xdotool search --name "PixelDebh: Retro-Rescue" | head -1)
echo "window $W geometry: $(xdotool getwindowgeometry $W | tr '\n' ' ')"
xdotool windowfocus $W 2>/dev/null; sleep 1
xdotool key Return; sleep 1.5; xdotool key Return; sleep 1.5; xdotool key Return; sleep 3
xdotool key F3
echo "game started, overlay on"
sleep ${1:-40}
xdotool key q; sleep 6
echo "toggled quality"
sleep 12
kill $PID 2>/dev/null
echo LAUNCH_DONE
