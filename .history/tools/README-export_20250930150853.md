Export 5 variants per photo (Windows, PowerShell)

This workflow generates five sizes from each original photo: 60 (LQIP), 640, 1024, 1600, and 2048, in WebP by default. Optionally also make JPEG.

Prerequisite
- Install ImageMagick (magick) for Windows: https://imagemagick.org/script/download.php#windows
  - During install, check "Install legacy utilities" and "Add application directory to your system path" if prompted.

Usage
1) Open Windows PowerShell.
2) Run the script from the project folder (adjust SourceDir as needed):

   # WebP only
   .\tools\export-variants.ps1 -SourceDir ".\Images\Wedding"

   # WebP + JPEG, include subfolders
   .\tools\export-variants.ps1 -SourceDir ".\Images\Wedding" -Formats webp,jpg -Recurse

3) Outputs go to: <SourceDir>\web\<size>\<filename>.<ext>
   - Example: Images\Wedding\web\640\2M2A6232-Enhanced-NR-2-Edit.webp

Notes
- Quality: defaults to 80 (LQIP 60). Adjust with -Quality 85 if desired.
- Sizes: change with -Sizes 60,640,1024,1600,2048
- Formats: choose webp, jpg, or both with -Formats webp,jpg
- Re-run any time; existing outputs are skipped if newer than the source.
- Export in sRGB; script strips metadata and auto-orients.

Next steps in HTML
- Use these outputs with srcset/sizes, e.g.:
  <img 
    src="Images/Wedding/web/640/2M2A6232-Enhanced-NR-2-Edit.webp"
    srcset="
      Images/Wedding/web/640/2M2A6232-Enhanced-NR-2-Edit.webp 640w,
      Images/Wedding/web/1024/2M2A6232-Enhanced-NR-2-Edit.webp 1024w,
      Images/Wedding/web/1600/2M2A6232-Enhanced-NR-2-Edit.webp 1600w,
      Images/Wedding/web/2048/2M2A6232-Enhanced-NR-2-Edit.webp 2048w"
    sizes="(max-width: 760px) 45vw, (max-width: 1000px) 20vw, 14vw"
    width="1600" height="2000" 
    alt="..." loading="lazy" decoding="async">

- Keep the original JPEG as a fallback with a <picture> if you want broad compatibility. WebP works in all modern browsers.
