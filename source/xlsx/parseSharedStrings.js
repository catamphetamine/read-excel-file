import {
  getSharedStrings
} from '../xml/xlsx.js'

export default function parseSharedStrings(content, xml) {
  if (!content) {
    return []
  }
  return getSharedStrings(xml.createDocument(content))
}