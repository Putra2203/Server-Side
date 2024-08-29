const models = require('../models');
const moment = require('moment');
const axios = require('axios');
const bcryptjs = require('bcryptjs');
const Validator = require('fastest-validator');
const { where } = require('sequelize');
const fs = require('fs')

function showTugasList(req, res) {
  const id = req.params.id;
  models.Status_tugas.findAll({
    where: { p_id: id },
    order: [['id', 'DESC']],
    include: [{
      model: models.Tugas,
      as: 'tugas',
    }]
  }).then(result => {
    res.status(200).json({
      tugas: result.map(item => ({
        tugas: item.tugas,
        status_tugas: {
          keterangan: item.keterangan, // Include keterangan property
          // ... other properties
        },
      })),
    });
  }).catch(error => {
    res.status(500).json({
      message: "Something went wrong",
      error: error,
    });
  });
}

function showTugas(req, res){

    const id = req.params.id;
    models.Tugas.findByPk(id).then(result =>{
        res.status(200).json({
            tugas:result
        });
    }).catch(error =>{
        res.status(500).json({
            message: "Something went wrong",
            error:error
        });
    });
}

function showPresensi(req, res){
    const id = req.params.id;
    if (true){
        models.Presensi.findAll({where:{p_id:id}}).then(result =>{
            res.status(200).json({
                presensi:result
            });
    }).catch(error =>{
        res.status(500).json({
            message: "Something went wrong",
            error:error
        });
    });
    }else{
        res.status(403).json({
            message: "bukan id kamu"
        })
    }
}

async function doPresensi(req, res, url) {
  try {
      const response = await axios.get('https://worldtimeapi.org/api/timezone/Asia/Jakarta');
      const time = moment.tz(response.data.datetime, 'Asia/Jakarta');
      const pid = req.params.id;
      const baseUrl = "http://localhost:3000/";
      const fileName = url.replace('\\', '/');
      const hari = time.day();
      const currentDate = moment(time);

      const jamMulai1Jumat = 7;
      const menitMulai1Jumat = 15;
      const jamBerakhir1Jumat = 8;
      const menitBerakhir1Jumat = 45;

      const jamMulai2Jumat = 13;
      const menitMulai2Jumat = 45;
      const jamBerakhir2Jumat = 14;
      const menitBerakhir2Jumat = 15;

      const jamMulai1Senmis = 7;
      const menitMulai1Senmis = 45;
      const jamBerakhir1Senmis = 8;
      const menitBerakhir1Senmis = 15;

      const jamMulai2Senmis = 15;
      const menitMulai2Senmis = 45;
      const jamBerakhir2Senmis = 16;
      const menitBerakhir2Senmis = 15;

      let presensi = {};

      const currentHour = currentDate.hours();
      const currentMinute = currentDate.minutes();

      const isInRange = (startHour, startMinute, endHour, endMinute) => {
          return (
              (currentHour > startHour || (currentHour === startHour && currentMinute >= startMinute)) &&
              (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute))
          );
      };

      if (hari === 5) {
          if (isInRange(jamMulai1Jumat, menitMulai1Jumat, jamBerakhir1Jumat, menitBerakhir1Jumat)) {
              presensi = {
                  check_in: currentDate,
                  image_url_in: baseUrl + fileName,
              };
          } else if (isInRange(jamMulai2Jumat, menitMulai2Jumat, jamBerakhir2Jumat, menitBerakhir2Jumat)) {
              presensi = {
                  check_out: currentDate,
                  image_url_out: baseUrl + fileName,
              };
          }
      } else if (hari !== 0 && hari !== 6) {
          if (isInRange(jamMulai1Senmis, menitMulai1Senmis, jamBerakhir1Senmis, menitBerakhir1Senmis)) {
              presensi = {
                  check_in: currentDate,
                  image_url_in: baseUrl + fileName,
              };
          } else if (isInRange(jamMulai2Senmis, menitMulai2Senmis, jamBerakhir2Senmis, menitBerakhir2Senmis)) {
              presensi = {
                  check_out: currentDate,
                  image_url_out: baseUrl + fileName,
              };
          }
      }

      if (Object.keys(presensi).length > 0) {
          models.Presensi.update(presensi, { where: { p_id: pid, tanggal: time.format('YYYY-MM-DD') } })
              .then((result) => {
                  res.status(201).json({
                      message: 'Presensi successful',
                      result: result,
                  });
              })
              .catch((error) => {
                  res.status(500).json({
                      message: 'Something went wrong',
                      error: error,
                  });
              });
      } else {
          res.status(400).json({
              message: 'Diluar jam presensi yang ditentukan',
          });
      }
  } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({
          message: 'Something went wrong',
          error: error,
      });
  }
}

  function doTugas(req, res, url) {
    const id = req.params.id;
    const tid = req.params.tid;

    const baseUrl = "http://localhost:3000/";
    const fileName = url.replace('\\', '/');

    // Mengambil informasi tugas
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
                keterangan: null, //Kondisi awal saat tugas belum dikumpulkan
            };

            // Variabel pembanding antara waktu sekarang dan deadline
            const currentDateTime = new Date();
            const dueDateTime = new Date(assignment.dueDate);

            if (currentDateTime > dueDateTime) {
                // telat
                tugas.keterangan = 0;
            } else {
                // sebelum deadline
                tugas.keterangan = 1;
            }

            // melakukan update terhadap status_tugas di database
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

function editPassword(req, res){
    bcryptjs.genSalt(10,async function(err,salt){
        bcryptjs.hash(req.body.password,salt,async function(err,hash){
            try {
                const id = req.params.id;
                const updatedPeserta = {
                    password: hash                
                }
                const schema = {
                    password: {type:"string", optional:false},
                }

                const v = new Validator();
                const validationResponse = v.validate(updatedPeserta, schema);

                if(validationResponse !== true){
                    return res.status(400).json({
                        message: "Validation false",
                        errors: validationResponse
                    });
                }

                models.Peserta_Magang.update(updatedPeserta, {where:{id:id}}).then(result =>{
                    res.status(200).json({
                        message: "Peserta Magang updated successfully"
                    });
                }).catch(error =>{
                    res.status(500).json({
                        message: "Something went wrong",
                        error:error
                    });
                });
            } catch (error){
                res.status(500).json({
                    message: "Something went wrong",
                    error:error
                });
            }
        });
    });
}

function editProfil(req, res) {
  try {
    const data = req.body
    const id = req.params.id

    const schema = {
      nama: { type: "string", optional: true, max: 50 },
      username: { type: "string", optional: true, max: 50 },
      asal_univ: { type: "string", optional: true, max: 50 },
      asal_jurusan: { type: "string", optional: true, max: 50 },
    }

    const v = new Validator();
    const validationResponse = v.validate(data, schema);

    if (validationResponse !== true) {
        return res.status(400).json({
            message: "Validation false",
            errors: validationResponse
        });
    }

    models.Peserta_Magang.update(
      data, {
        where: {id}
      }
    ).then(result => {
      res.status(200).json({
        "message": "Profile Updated Successfully"
      })
    })
  } catch (error) {
    res.status(400).json({
      "message": "Something Went Wrong",
      "errors": {
        "name": error.name,
        "message": error.message
      }
    })
  }
}

async function editFotoProfil(req, res) {
  try {
    const filePath = req.file?.path
    const id = req.params.id
    
    if (!filePath) {
      console.log(!filePath)
      return res.status(304).json()
    }
    
    const baseUrl = "http://localhost:3000/";
    const prevPictPath = await models.Peserta_Magang.findByPk(id)
    const path = prevPictPath.foto_profil?.replace(baseUrl, './')

    if (path) {
      fs.unlink(path, err => {
        if (err) {
          return res.status(501).json({
            "errors": {
              "name": err.name,
              "message": err.message
            }
          })
        }
      })
    }
    
    const fileName = filePath.replace('\\', '/');
    const data = {
      foto_profil: baseUrl + fileName
    }

    models.Peserta_Magang.update(data, {
      where: { id }
    }).then(result => {
      res.status(200).json({
        "message": "Profile Picture Updated Successfully"
      })
    })
  } catch (error) {
    res.status(400).json({
      "message": "Something Went Wrong",
      "errors": {
        "name": error.name,
        "message": error.message
      }
    })
  }
}

async function deleteFotoProfil(req, res) {
  try {
    const id = req.params.id

    const baseUrl = "http://localhost:3000/";
    const prevPictPath = await models.Peserta_Magang.findByPk(id)
    const path = prevPictPath.foto_profil.replace(baseUrl, './')

    fs.unlink(path, err => {
      if (err) {
        return res.status(501).json({
          "errors": {
            "name": err.name,
            "message": err.message
          }
        })
      }
    })
    
    models.Peserta_Magang.update({
      foto_profil: null
    }, {
      where: { id }
    }).then(result => {
      res.status(200).json({
        "message": "Profile Picture Deleted"
      })
    })

  } catch (error) {
    res.status(400).json({
      "message": "Something Went Wrong",
      "errors": {
        "name": error.name,
        "message": error.message
      }
    })
  }
}

module.exports = {
    showTugasList:showTugasList,
    showTugas:showTugas,
    showPresensi:showPresensi,
    doPresensi:doPresensi,
    doTugas:doTugas,
    editPassword:editPassword,
    editProfil,
    editFotoProfil,
    deleteFotoProfil
}