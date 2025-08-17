@echo off
echo ===================================================
echo Staff Photo Directory Verification
echo ===================================================
echo.
echo Current Staff Admission directories:
dir "d:\CRM Final editing\Gandhii Bai CRM - 1\server\photos\Staff Admission" /B
echo.
echo ===================================================
echo Recent uploads in temp folder:
if exist "d:\CRM Final editing\Gandhii Bai CRM - 1\server\photos\Staff Admission\temp" (
    dir "d:\CRM Final editing\Gandhii Bai CRM - 1\server\photos\Staff Admission\temp" /B /O:D
) else (
    echo No temp folder found
)
echo.
echo ===================================================
echo Next expected Staff ID: STF007
echo Expected photo location: 
echo   d:\CRM Final editing\Gandhii Bai CRM - 1\server\photos\Staff Admission\STF007\photo_[timestamp].jpg
echo ===================================================
pause
