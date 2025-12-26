@echo off
REM Uninstall Cleanup Script
REM This script is called by the WiX uninstaller to clean up OS integrations

echo [ThirdScreen Uninstaller] Starting cleanup...

REM The exe path will be passed as argument
set APP_EXE=%1

REM Call the Rust uninstaller via Tauri command
REM This executes the uninstaller::perform_uninstall_cleanup() function
"%APP_EXE%" --uninstall-cleanup

echo [ThirdScreen Uninstaller] Cleanup complete

exit /b 0
