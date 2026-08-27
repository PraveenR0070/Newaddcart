@echo off
cd /d "C:\ForHarness\Newaddcart"
call npm run daily:naukri
if errorlevel 1 (
    echo [%date% %time%] Naukri daily job failed >> "C:\ForHarness\Newaddcart\naukri_run.log"
    exit /b 1
)
