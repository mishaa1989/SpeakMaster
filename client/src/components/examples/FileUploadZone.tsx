import FileUploadZone from '../admin/FileUploadZone'

export default function FileUploadZoneExample() {
  return (
    <FileUploadZone 
      onFilesSelected={(files) => console.log('Files selected:', files)} 
    />
  )
}