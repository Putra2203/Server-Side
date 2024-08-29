function upload(req, res){
    const file = req.file?.path
    console.log(file)
    if(file){
        res.status(201).json({
            mesaage: "Image upload successfully",
            url: file
        });
    }else{
        res.status(500).json({
            mesaage: "Something went wrong!"
        });
    }
}

module.exports = {
    upload: upload
}