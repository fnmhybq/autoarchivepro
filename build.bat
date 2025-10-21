@echo off
echo Building project...
call npm run build
echo Creating dist directory...
if exist dist rmdir /s /q dist
mklink /D dist out
echo Build completed!
