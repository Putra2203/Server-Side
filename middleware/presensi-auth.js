const axios = require('axios');
const moment = require('moment-timezone');

const protectUpload = async (req, res, next) => {
    try {
        const response = await axios.get('https://worldtimeapi.org/api/timezone/Asia/Jakarta');
        const time = moment.tz(response.data.datetime, 'Asia/Jakarta');
        const hari = time.day();
        const currentHour = time.hours();
        const currentMinute = time.minutes();

        const isInRange = (startHour, startMinute, endHour, endMinute) => {
            return (
                (currentHour > startHour || (currentHour === startHour && currentMinute >= startMinute)) &&
                (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute))
            );
        };

        let canUpload = false;
        if (hari === 5) {
            if (isInRange(7, 15, 8, 45)) {
                canUpload = true;
            } else if (isInRange(13, 45, 14, 15)) {
                canUpload = true;
            }
        } else if (hari !== 0 && hari !== 6) {
            if (isInRange(7, 45, 8, 15)) {
                canUpload = true;
            } else if (isInRange(15, 45, 16, 15)) {
                canUpload = true;
            }
        }

        if (!canUpload) {
            return res.status(400).json({
                message: 'Diluar jam presensi yang ditentukan',
            });
        }

        next();

    } catch (error) {
        console.error('Error during upload protection check:', error);
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

module.exports = {
    protectUpload,
};
