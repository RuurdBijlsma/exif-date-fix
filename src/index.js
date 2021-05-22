import fs from "fs";
import path from "path";
import modifyExif from 'modify-exif'
import mime from "mime-types";
import {utimes} from 'utimes';


export default async function fix() {
    let args = process.argv;
    let dir = args[args.length - 1];
    let files = await fs.promises.readdir(dir);
    let dates = [];

    for (let file of files) {
        let match = file.match(/(^|[^0-9])(\d\d\d\d)-(\d\d)-(\d\d)[^0-9]/);
        if (match) {
            // format is 2015-01-25
            let [_, __, year, month, day] = match;
            let date = new Date(`${year}-${month}-${day} 15:00:00`);
            dates.push(date);
            continue;
        }

        match = file.match(/(^|[^0-9])([21]\d\d\d)(\d\d)(\d\d)[^0-9](\d\d)(\d\d)(\d\d)/);
        if (match) {
            // format is 20150125_193531 possibly with ms after that
            let [_, __, year, month, day, hour, minute, second] = match;
            let date = new Date(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
            dates.push(date);
            continue
        }

        match = file.match(/(^|[^0-9])([21]\d\d\d)(\d\d)(\d\d)[^0-9]/);
        if (match) {
            // format is 20150125
            let [_, __, year, month, day] = match;
            let date = new Date(`${year}-${month}-${day} 15:00:00`);
            dates.push(date);
            continue;
        }

        dates.push(null);
        console.log("Can't parse", file);
    }

    let fixedN = 0;
    let totalN = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const d = dates[i];
        if (d === null) {
            console.log("Can't fix exif of", file, '[unknown date]');
            continue;
        }
        try {
            let fullFile = path.join(dir, file);

            let ext = path.extname(file.toLowerCase());
            if (ext.includes('tif') || ext.includes('jpg') || ext.includes('jpeg')) {
                const year = d.getFullYear(),
                    month = (d.getMonth() + 1).toString().padStart(2, '0'),
                    day = d.getDate().toString().padStart(2, '0'),
                    hour = d.getHours().toString().padStart(2, '0'),
                    minute = d.getMinutes().toString().padStart(2, '0'),
                    second = d.getSeconds().toString().padStart(2, '0');
                const dateString = `${year}:${month}:${day} ${hour}:${minute}:${second}`;
                let fileBuffer = await fs.promises.readFile(fullFile);
                let newBuffer = modifyExif(fileBuffer, data => {
                    // 36867: tag ID of `DateTimeOriginal` tag
                    data.Exif['36867'] = dateString;
                });

                await fs.promises.writeFile(fullFile, newBuffer);
            } else {
                await utimes(fullFile, {
                    btime: d.getTime() // 1984-03-10T14:00:00.000Z
                });
            }
            fixedN++;
        } catch (e) {
            console.warn("Can't fix exif of", file, e);
        }
    }

    console.log(`Fixed [${fixedN} / ${totalN}] files`)
}


function getFileType(filePath) {
    let fileExt = path.extname(filePath);
    let mimeType = mime.lookup(fileExt);
    return mimeType === false ? mimeType : mimeType.split('/')[0];
}

fix().then();
