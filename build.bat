@echo off
setlocal

echo === Instalar dependencias ===
call npm install || goto :err

echo === Prisma ===
call npx prisma db push || goto :err
call npx prisma generate || goto :err

echo === Limpiar cache de Next.js ===
call npm run clean || goto :err

echo === Actualizar versión ===
call npm run update-version || goto :err

echo === Compilar Next.js ===
call npm run build || goto :err

echo === Preparar carpeta build ===
if exist build rmdir /s /q build
mkdir build

echo === Copiar archivos necesarios ===
xcopy ".next\standalone" "build" /E /I /Y
xcopy ".next\static" "build\.next\static" /E /I /Y
xcopy "public" "build\public" /E /I /Y
copy "package.json" "build\"
if exist package-lock.json copy "package-lock.json" "build\"

echo === Crear archivo ZIP ===
pushd build
powershell -NoProfile -Command "Compress-Archive -Path * -DestinationPath build.zip -Force"
popd

echo === Build completado ===
echo El archivo build.zip se encuentra en la carpeta build
goto :eof

:err
echo.
echo ERROR: Hubo un fallo en el paso anterior. Abortando.
exit /b 1
