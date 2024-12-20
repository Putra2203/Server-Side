const models = require("../models");
const moment = require("moment");
const axios = require("axios");
const bcryptjs = require("bcryptjs");
const Validator = require("fastest-validator");
const { where } = require("sequelize");
const fs = require("fs");

const allowedLatitude = -6.983066906515344;
const allowedLongitude = 110.41367971193375;
const allowedRadius = 1500; // radius in meters

// Fungsi untuk menghitung jarak menggunakan rumus Haversine
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Jarak dalam meter
}

function showTugasList(req, res) {
  const id = req.params.id;
  models.Status_tugas.findAll({
    where: { p_id: id },
    order: [["id", "DESC"]],
    include: [
      {
        model: models.Tugas,
        as: "tugas",
      },
    ],
  })
    .then((result) => {
      res.status(200).json({
        tugas: result.map((item) => ({
          tugas: item.tugas,
          status_tugas: {
            keterangan: item.keterangan,
          },
        })),
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong",
        error: error,
      });
    });
}

function showTugas(req, res) {
  const id = req.params.id;
  models.Tugas.findByPk(id)
    .then((result) => {
      res.status(200).json({
        tugas: result,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong",
        error: error,
      });
    });
}

function showPresensi(req, res) {
  const id = req.params.id;

  models.Presensi.findAll({
    where: { p_id: id },
    attributes: [
      "check_in",
      "check_out",
      "tanggal",
      "image_url_in",
      "image_url_out",
      "latitude_in",
      "longitude_in",
      "latitude_out",
      "longitude_out",
    ],
    include: [
      {
        model: models.Peserta_Magang,
        as: "peserta_magang",
        attributes: ["nama", "asal_univ", "asal_jurusan", "no_telp"],
      },
    ],
  })
    .then((result) => {
      if (result.length === 0) {
        return res.status(404).json({
          message: "Data presensi tidak ditemukan",
        });
      }

      const formattedPresensi = result.map((presensi) => {
        const checkInTime = presensi.check_in
          ? moment(presensi.check_in).format("HH:mm:ss")
          : null;
        const checkOutTime = presensi.check_out
          ? moment(presensi.check_out).format("HH:mm:ss")
          : null;
        const hari = moment(presensi.tanggal).format("dddd");

        const lokasiIn = presensi.latitude_in && presensi.longitude_in
          ? `${presensi.latitude_in}, ${presensi.longitude_in}`
          : "Lokasi tidak tersedia";

        const lokasiOut = presensi.latitude_out && presensi.longitude_out
          ? `${presensi.latitude_out}, ${presensi.longitude_out}`
          : "Lokasi tidak tersedia";

        return {
          nama: presensi.peserta_magang.nama,
          tanggal: moment(presensi.tanggal).format("YYYY-MM-DD"),
          hari: hari,
          check_in: checkInTime,
          check_out: checkOutTime,
          image_url_in: presensi.image_url_in || null,
          image_url_out: presensi.image_url_out || null,
          lokasi_in: lokasiIn,
          lokasi_out: lokasiOut,
        };
      });

      res.status(200).json({
        presensi: formattedPresensi,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong",
        error: error,
      });
    });
}


async function doPresensi(req, res, url) {
  try {
    // Menggunakan waktu server lokal
    const time = moment().tz("Asia/Jakarta");
    const pid = req.params.id;
    const baseUrl = "http://localhost:3000/";
    const fileName = url.replace("\\", "/");
    const { latitude, longitude } = req.body; // Mengambil latitude dan longitude

    const hari = time.day();
    const currentDate = time;

    const jamMulai1Jumat = 7;
    const menitMulai1Jumat = 15;
    const jamBerakhir1Jumat = 8;
    const menitBerakhir1Jumat = 45;

    const jamMulai2Jumat = 13;
    const menitMulai2Jumat = 45;
    const jamBerakhir2Jumat = 14;
    const menitBerakhir2Jumat = 15;

    const jamMulai1Senmis = 7;
    const menitMulai1Senmis = 20;
    const jamBerakhir1Senmis = 7;
    const menitBerakhir1Senmis = 34;

    const jamMulai2Senmis = 7;
    const menitMulai2Senmis = 35;
    const jamBerakhir2Senmis = 22;
    const menitBerakhir2Senmis = 45;

    let presensi = {};
    const currentHour = currentDate.hours();
    const currentMinute = currentDate.minutes();

    const isInRange = (startHour, startMinute, endHour, endMinute) => {
      return (
        (currentHour > startHour ||
          (currentHour === startHour && currentMinute >= startMinute)) &&
        (currentHour < endHour ||
          (currentHour === endHour && currentMinute <= endMinute))
      );
    };

    if (hari === 5) {
      if (
        isInRange(
          jamMulai1Jumat,
          menitMulai1Jumat,
          jamBerakhir1Jumat,
          menitBerakhir1Jumat
        )
      ) {
        presensi = {
          check_in: currentDate,
          image_url_in: baseUrl + fileName,
          latitude_in: latitude,
          longitude_in: longitude,
        };
      } else if (
        isInRange(
          jamMulai2Jumat,
          menitMulai2Jumat,
          jamBerakhir2Jumat,
          menitBerakhir2Jumat
        )
      ) {
        presensi = {
          check_out: currentDate,
          image_url_out: baseUrl + fileName,
          latitude_out: latitude,
          longitude_out: longitude,
        };
      }
    } else if (hari !== 0 ) {
      if (
        isInRange(
          jamMulai1Senmis,
          menitMulai1Senmis,
          jamBerakhir1Senmis,
          menitBerakhir1Senmis
        )
      ) {
        presensi = {
          check_in: currentDate,
          image_url_in: baseUrl + fileName,
          latitude_in: latitude,
          longitude_in: longitude,
        };
      } else if (
        isInRange(
          jamMulai2Senmis,
          menitMulai2Senmis,
          jamBerakhir2Senmis,
          menitBerakhir2Senmis
        )
      ) {
        presensi = {
          check_out: currentDate,
          image_url_out: baseUrl + fileName,
          latitude_out: latitude,
          longitude_out: longitude,
        };
      }
    }

    if (Object.keys(presensi).length > 0) {
      try {
        const result = await models.Presensi.update(presensi, {
          where: { p_id: pid, tanggal: time.format("YYYY-MM-DD") },
        });
        res.status(201).json({
          message: "Presensi successful",
          result: result,
        });
      } catch (error) {
        throw error;
      }
    } else {
      res.status(400).json({
        message: "Diluar jam presensi yang ditentukan",
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error,
    });
  }
}
function doTugas(req, res, url) {
  const id = req.params.id;
  const tid = req.params.tid;

  const baseUrl = "http://localhost:3000/";
  const fileName = url.replace("\\", "/");

  models.Tugas.findByPk(tid)
    .then((assignment) => {
      if (!assignment) {
        return res.status(404).json({
          message: "Tugas Tidak Ditemukan",
        });
      }

      const tugas = {
        tugas_url: baseUrl + fileName,
        status_pengerjaan: true,
        keterangan: null,
      };

      const currentDateTime = new Date();
      const dueDateTime = new Date(assignment.dueDate);

      if (currentDateTime > dueDateTime) {
        tugas.keterangan = 0;
      } else {
        tugas.keterangan = 1;
      }

      models.Status_tugas.update(tugas, { where: { p_id: id, t_id: tid } })
        .then((result) => {
          res.status(201).json({
            message: "Tugas Berhasil Diupload",
          });
        })
        .catch((error) => {
          res.status(500).json({
            message: "Something went wrong",
            error: error,
          });
        });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Terjadi kesalahan saat mengambil informasi tugas",
        error: error,
      });
    });
}

function editPassword(req, res) {
  bcryptjs.genSalt(10, async function (err, salt) {
    bcryptjs.hash(req.body.password, salt, async function (err, hash) {
      try {
        const id = req.params.id;
        const updatedPeserta = {
          password: hash,
        };
        const schema = {
          password: { type: "string", optional: false },
        };

        const v = new Validator();
        const validationResponse = v.validate(updatedPeserta, schema);

        if (validationResponse !== true) {
          return res.status(400).json({
            message: "Validation false",
            errors: validationResponse,
          });
        }

        models.Peserta_Magang.update(updatedPeserta, { where: { id: id } })
          .then((result) => {
            res.status(200).json({
              message: "Peserta Magang updated successfully",
            });
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong",
              error: error,
            });
          });
      } catch (error) {
        res.status(500).json({
          message: "Something went wrong",
          error: error,
        });
      }
    });
  });
}

function editProfil(req, res) {
  try {
    const data = req.body;
    const id = req.params.id;

    const schema = {
      nama: { type: "string", optional: true, max: 50 },
      username: { type: "string", optional: true, max: 50 },
      asal_univ: { type: "string", optional: true, max: 50 },
      asal_jurusan: { type: "string", optional: true, max: 50 },
    };

    const v = new Validator();
    const validationResponse = v.validate(data, schema);

    if (validationResponse !== true) {
      return res.status(400).json({
        message: "Validation false",
        errors: validationResponse,
      });
    }

    models.Peserta_Magang.update(data, {
      where: { id },
    }).then((result) => {
      res.status(200).json({
        message: "Profile Updated Successfully",
      });
    });
  } catch (error) {
    res.status(400).json({
      message: "Something Went Wrong",
      errors: {
        name: error.name,
        message: error.message,
      },
    });
  }
}

async function editFotoProfil(req, res) {
  try {
    const filePath = req.file?.path;
    const id = req.params.id;

    if (!filePath) {
      return res.status(304).json();
    }

    const baseUrl = "http://localhost:3000/";
    const prevPictPath = await models.Peserta_Magang.findByPk(id);
    const path = prevPictPath.foto_profil?.replace(baseUrl, "./");

    if (path) {
      fs.unlink(path, (err) => {
        if (err) {
          return res.status(501).json({
            errors: {
              name: err.name,
              message: err.message,
            },
          });
        }
      });
    }

    const fileName = filePath.replace("\\", "/");
    const data = {
      foto_profil: baseUrl + fileName,
    };

    models.Peserta_Magang.update(data, {
      where: { id },
    }).then(() => {
      res.status(200).json({
        message: "Profile Picture Updated Successfully",
      });
    });
  } catch (error) {
    res.status(400).json({
      message: "Something Went Wrong",
      errors: {
        name: error.name,
        message: error.message,
      },
    });
  }
}

async function deleteFotoProfil(req, res) {
  try {
    const id = req.params.id;
    const baseUrl = "http://localhost:3000/";
    const prevPictPath = await models.Peserta_Magang.findByPk(id);
    const path = prevPictPath.foto_profil.replace(baseUrl, "./");

    fs.unlink(path, (err) => {
      if (err) {
        return res.status(501).json({
          errors: {
            name: err.name,
            message: err.message,
          },
        });
      }
    });

    models.Peserta_Magang.update(
      {
        foto_profil: null,
      },
      {
        where: { id },
      }
    ).then(() => {
      res.status(200).json({
        message: "Profile Picture Deleted",
      });
    });
  } catch (error) {
    res.status(400).json({
      message: "Something Went Wrong",
      errors: {
        name: error.name,
        message: error.message,
      },
    });
  }
}

function hitungSisaWaktuMagang(req, res) {
  const id = req.params.id;

  models.Peserta_Magang.findByPk(id)
    .then((peserta) => {
      if (!peserta) {
        return res.status(404).json({
          message: "Peserta magang tidak ditemukan",
        });
      }

      const tanggalMulai = moment(peserta.tanggal_mulai);
      const tanggalSelesai = moment(peserta.tanggal_selesai);
      const tanggalHariIni = moment();

      // Hitung sisa waktu magang
      const sisaWaktu = tanggalSelesai.diff(tanggalHariIni, 'days'); // Menghitung selisih hari

      // Jika sisa waktu negatif (artinya sudah lewat), set menjadi 0
      const sisaHari = sisaWaktu > 0 ? sisaWaktu : 0;

      res.status(200).json({
        message: `Sisa waktu magang: ${sisaHari} hari`,
        sisaWaktu: sisaHari,
        tanggal_mulai: tanggalMulai.format('YYYY-MM-DD'),
        tanggal_selesai: tanggalSelesai.format('YYYY-MM-DD'),
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Terjadi kesalahan saat menghitung sisa waktu magang",
        error: error.message,
      });
    });
}


module.exports = {
  showTugasList: showTugasList,
  showTugas: showTugas,
  showPresensi: showPresensi,
  doPresensi: doPresensi,
  doTugas: doTugas,
  editPassword: editPassword,
  editProfil,
  editFotoProfil,
  deleteFotoProfil,
  hitungSisaWaktuMagang,
};
