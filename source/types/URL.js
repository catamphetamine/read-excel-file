export default function URL() {}

// URL regexp explanation:
//
// /^
//
// 	(?:
// 	  // Matches optional "http(s):" or "ftp:":
// 		(?:
// 			(?:https?|ftp):
// 		)?
//
// 	  // Matches "//" (required):
// 		\/\/
// 	)
//
// 	// Matches a valid non-local IP address:
// 	(?:
// 		(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])
// 		(?:
// 			\.
// 			(?:1?\d{1,2}|2[0-4]\d|25[0-5])
// 		){2}
// 		(?:
// 			\.
// 			(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])
// 		)
//
// 	  // Or,
// 		|
//
// 	  // Matches an alpha-numeric domain name.
// 		(?:
// 			(?:
// 				[a-z0-9\u00a1-\uffff]
// 				[a-z0-9\u00a1-\uffff_-]{0,62}
// 			)?
// 			[a-z0-9\u00a1-\uffff]
// 			\.
// 		)*
// 		(?:
// 	    // Domain zone: "com", "net", etc (required):
// 			[a-z\u00a1-\uffff]{2,}
// 		)
// 	)
//
// 	// Matches a colon and a port number:
// 	(?::\d{2,5})?
//
// 	// Matches everything after the "origin":
// 	// * pathname
// 	// * query
// 	// * hash
// 	(?:[/?#]\S*)?
//
// $/i

const regexp = /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)*(?:[a-z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:[/?#]\S*)?$/i

// https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
export function isURL(value) {
	return regexp.test(value)
}