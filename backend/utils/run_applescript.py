import subprocess

def run_applescript(command: str):
    return subprocess.run(["osascript", "-e", command])