const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

// Magic bytes válidos
const MAGIC_BYTES = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47]
}

function validarMagicBytes(buffer) {
    const isJpeg = MAGIC_BYTES.jpeg.every((byte, i) => buffer[i] === byte)
    const isPng = MAGIC_BYTES.png.every((byte, i) => buffer[i] === byte)
    return isJpeg || isPng
}

async function uploadImagem(buffer, mimeType, pasta) {
    if (!validarMagicBytes(buffer)) {
        throw new Error('TIPO_INVALIDO')
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: pasta,
                resource_type: 'image',
                type: 'private',
                format: 'webp',
                transformation: [
                    { width: 1024, height: 1024, crop: 'limit' },
                    { quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) return reject(error)
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                })
            }
        )
        uploadStream.end(buffer)
    })
}

async function deletarImagem(publicId) {
    try {
        await cloudinary.uploader.destroy(publicId, { type: 'private', resource_type: 'image' })
    } catch (e) {
        console.error('[storage] Erro ao deletar imagem:', e)
    }
}

async function gerarUrlAssinada(publicId, ttlSegundos = 3600) {
    return cloudinary.utils.private_download_url(publicId, 'webp', {
        expires_at: Math.floor(Date.now() / 1000) + ttlSegundos,
        attachment: false
    })
}

module.exports = { uploadImagem, deletarImagem, gerarUrlAssinada }