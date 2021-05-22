import fs from "fs";
import path from "path";
import modifyExif from 'modify-exif'

export default async function fix() {
    let args = process.argv;
    let dir = args[args.length - 1];
    let rename = args.includes('--rename');
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

    try {
        await fs.promises.mkdir('./fixed');
    } catch (e) {
    }

    let fixedN = 0;
    let totalN = files.length;
    let newNames = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const d = dates[i];
        if (d === null || file.endsWith('gif') || file.endsWith('mp4')) {
            console.log("Can't fix exif of", file);
            continue;
        }
        try {
            const year = d.getFullYear(),
                month = (d.getMonth() + 1).toString().padStart(2, '0'),
                day = d.getDate().toString().padStart(2, '0'),
                hour = d.getHours().toString().padStart(2, '0'),
                minute = d.getMinutes().toString().padStart(2, '0'),
                second = d.getSeconds().toString().padStart(2, '0');

            let fileBuffer = await fs.promises.readFile(path.join(dir, file));
            let newBuffer = modifyExif(fileBuffer, data => {
                // 36867: tag ID of `DateTimeOriginal` tag
                data.Exif['36867'] = `${year}:${month}:${day} ${hour}:${minute}:${second}`;
            });


            let newName = file;
            if (rename) {
                let ext = path.extname(file);
                let j = 0;
                do {
                    newName = `IMG_${year}${month}${day}_${hour}${minute}${second}${
                        j === 0 ? '' : `(${j})`
                    }${ext}`;
                    j++;
                } while (newNames.includes(newName));
                newNames.push(newName);
            }
            await fs.promises.writeFile(path.join('./fixed', newName), newBuffer);
            fixedN++;
        } catch (e) {
            console.warn("Can't fix exif of", file, e);
        }
    }

    console.log(`Fixed [${fixedN} / ${totalN}] files, output dir: ${path.resolve('./fixed')}`)
}

fix().then();
