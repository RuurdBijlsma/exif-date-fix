# Image EXIF Fixer CLI

Fix images where the date field is missing or incorrect in the EXIF data, but present in the filename (
i.e. `IMG_20210401_193452.jpg`).

## Usage

1. `npm i -g ruurdbijlsma/exif-date-fix`
2. `fix-exif ./`

### Notes

* File will be fixed inline! 
* Old exif/creation date values will be overwritten!
* Supported filename formats:
    * `_20141130_123828.JPG`
    * `2012-08-26_18-20-22_HDR-edited.jpg`
    * `2013-05-19(1).jpg`
    * `IMG_20120220_221905.jpg`
    * `PANO_20130622_091512.jpg`
    * `TINYPLANET_PANO_20140713_171926.jpg`
    * `IMG-20150116-WA0000.JPG`
    * Anything similarly formatted
* Non-images also supported, if it's not an exif supported format, the program will change the creation date on the file.
