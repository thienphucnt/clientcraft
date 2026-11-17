' Zero-Window, Zero-Focus-Steal Launcher for Vietlott QuantMatrix Argon High Background Runner
' Runs via wscript.exe (IMAGE_SUBSYSTEM_WINDOWS_GUI) with WindowStyle = 0 (SW_HIDE / CREATE_NO_WINDOW)
Option Explicit
Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "c:\Users\Admin\Documents\antigravity\keen-borg"
cmd = "powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File ""c:\Users\Admin\Documents\antigravity\keen-borg\scripts\run-argon-retrospective-bg.ps1"""
sh.Run cmd, 0, True
