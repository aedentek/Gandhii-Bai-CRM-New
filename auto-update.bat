@echo off
echo 🚀 Starting auto-update process...

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Error: Not in a git repository
    exit /b 1
)

REM Update dependencies
echo 📦 Updating npm dependencies...
npm update

REM Fix security vulnerabilities
echo 🔒 Fixing security vulnerabilities...
npm audit fix --force

REM Build the project to ensure it works
echo 🏗️ Building project...
npm run build

REM Check if there are any changes
git status --porcelain > temp_status.txt
set /p changes=<temp_status.txt
del temp_status.txt

if not "%changes%"=="" (
    echo ✅ Changes detected, committing...
    
    REM Add all changes
    git add .
    
    REM Commit with timestamp
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (
        for /f "tokens=1-2 delims=: " %%e in ('time /t') do (
            set TIMESTAMP=%%c-%%a-%%b %%e:%%f
        )
    )
    git commit -m "chore: auto-update dependencies and build - %TIMESTAMP%"
    
    REM Push to main branch
    echo 🚢 Pushing to remote repository...
    git push origin main
    
    echo ✅ Auto-update completed successfully!
) else (
    echo ℹ️ No changes detected, skipping commit
)

echo 🎉 Process completed!
pause
