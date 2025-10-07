import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Función para crear un storage dinámico
const crearStorage = (carpeta: string) => {
  const uploadDir = path.join(__dirname, '../../uploads', carpeta)

  // Crear carpeta si no existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
      cb(null, name)
    },
  })
}

// Middlewares separados
export const cargarAvisosNoticias = multer({ storage: crearStorage('avisosNoticias') })
export const cargarDocumentosAsamblea = multer({ storage: crearStorage('asambleas') })
