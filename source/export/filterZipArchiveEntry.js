// An `.xlsx` `.zip` archive could contain all kinds of files,
// such as `.bin` printer settings or `.png` images, etc.
//
// Because `read-excel-file` doesn't support returning any of those types of data,
// there's no need to read those files from the `.xlsx` `.zip` archive,
// optimizing the unpacking process a little bit.
//
export default function filterZipArchiveEntry({ path }) {
	return path.endsWith('.xml') || path.endsWith('.xml.rels')
}