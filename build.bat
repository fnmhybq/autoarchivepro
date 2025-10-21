@echo off
echo Building project...
call npm run build
echo Creating dist directory...
if exist dist rmdir /s /q dist
xcopy out dist /E /I /H /Y
echo Build completed!
