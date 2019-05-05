@ECHO OFF
cls
rmdir edge /s /q
mkdir edge
cd edge
echo Created directory /edge
call pwabuilder -l debug -p edgeextension -f edgeextension -m ..\client\manifest.json > ../edgebuild.log 2>&1
echo Edge extension folder created
cd OpenTitles\edgeextension\manifest
powershell -Command "(gc appxmanifest.xml) -replace 'INSERT-YOUR-PACKAGE-IDENTITY-NAME-HERE', '6097FlorisdeBijl.OpenTitles' | Out-File appxmanifest.xml"
powershell -Command "(gc appxmanifest.xml) -replace 'CN=INSERT-YOUR-PACKAGE-IDENTITY-PUBLISHER-HERE', 'CN=6E934F03-2A8F-40A8-9615-5288481A7BE8' | Out-File appxmanifest.xml"
powershell -Command "(gc appxmanifest.xml) -replace 'INSERT-YOUR-PACKAGE-PROPERTIES-PUBLISHERDISPLAYNAME-HERE', 'Floris de Bijl' | Out-File appxmanifest.xml"
echo Appxmanifest amended
xcopy ..\..\..\..\client\icons\opaquelogo44.png Assets\Square44x44Logo.png /y > nul 2>&1
xcopy ..\..\..\..\client\icons\opaquelogo50.png Assets\StoreLogo.png /y > nul 2>&1
xcopy ..\..\..\..\client\icons\opaquelogo150.png Assets\Square150x150Logo.png /y > nul 2>&1
echo Placeholder logos overwritten
cd ..\..\..\
echo Packaging extension for release
pwabuilder -l debug -p edgeextension package OpenTitles\edgeextension\manifest\ >> ../edgebuild.log 2>&1
pause