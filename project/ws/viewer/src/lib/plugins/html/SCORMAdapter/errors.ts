/* tslint:disable */
export const errorCodes: IErrorCode[] = [{
  0: {
    errorString: 'No Error',
    diagnostic: 'No error occurred, the previous API call was successful.',
  },
  101: {
    errorString: 'General Exception',
    diagnostic: 'No specific error code exists to describe the error.',
  },
  201: {
    errorString: 'Invalid argument error',
    diagnostic: 'An argument represents an invalid data model element or is otherwise incorrect.',
  },
  202: {
    errorString: 'Element cannot have children',
    diagnostic: 'LMSGetValue was called with a data model element name that ends in “_children” for a data model element that does not support the “_children” suffix.',
  },
  203: {
    errorString: 'Element not an array. Cannot have count',
    diagnostic: 'LMSGetValue was called with a data model element name that ends in “_count” for a data model element that does not support the “_count” suffix.',
  },
  301: {
    errorString: 'Not initialized',
    diagnostic: 'An API call was made before the call to LMSInitialize.',
  },
  401: {
    errorString: 'Not implemented error',
    diagnostic: 'The data model element indicated in a call to LMSGetValue or LMSSetValue is valid, but was not implemented by this LMS. SCORM 1.2 defines a set of data model elements as being optional for an LMS to implement.',
  },
  402: {
    errorString: 'Invalid set value, element is a keyword',
    diagnostic: 'LMSSetValue was called on a data model element that represents a keyword (elements that end in \'_children\' and \'_count\').',
  },
  403: {
    errorString: 'Element is read only',
    diagnostic: 'LMSSetValue was called with a data model element that can only be read.',
  },
  404: {
    errorString: 'Element is write only',
    diagnostic: 'LMSGetValue was called on a data model element that can only be written to.',
  },
  405: {
    errorString: 'Incorrect Data Type',
    diagnostic: 'LMSSetValue was called with a value that is not consistent with the data format of the supplied data model element.',
  },
}]

interface IErrorCode {
  [code: number]: {
    errorString: string,
    diagnostic: string
  }
}
export interface IErrorCodeMap {
  [code: number]: {
    errorString: string,
    diagnostic: string,
  }
}

/**
 * Flat lookup for the SCORM 1.2 codes above.
 *
 * `errorCodes` is an array holding a single map, so `errorCodes[101]` is undefined - it is
 * `errorCodes[0][101]` that resolves. Indexing the array directly is what made
 * LMSGetErrorString only ever answer for code 0. Use these maps instead.
 */
export const scorm12Errors: IErrorCodeMap = errorCodes[0]

/**
 * SCORM 2004 error codes. Deliberately a separate table rather than an extension of the
 * 1.2 one: the 4xx range is reused with different meanings between the versions (401 is
 * "Not implemented" in 1.2 but "Undefined Data Model Element" in 2004, 403 is "read only"
 * in 1.2 but "value not initialized" in 2004), so merging them would report the wrong
 * string for whichever version came second.
 */
export const scorm2004Errors: IErrorCodeMap = {
  0: { errorString: 'No Error', diagnostic: 'No error occurred, the previous API call was successful.' },
  101: { errorString: 'General Exception', diagnostic: 'No specific error code exists to describe the error.' },
  102: { errorString: 'General Initialization Failure', diagnostic: 'Call to Initialize failed for an unknown reason.' },
  103: { errorString: 'Already Initialized', diagnostic: 'Call to Initialize was made after the SCO was already initialized.' },
  104: { errorString: 'Content Instance Terminated', diagnostic: 'Call to Initialize was made after the SCO was terminated.' },
  111: { errorString: 'General Termination Failure', diagnostic: 'Call to Terminate failed for an unknown reason.' },
  112: { errorString: 'Termination Before Initialization', diagnostic: 'Call to Terminate was made before the SCO was initialized.' },
  113: { errorString: 'Termination After Termination', diagnostic: 'Call to Terminate was made after the SCO was already terminated.' },
  122: { errorString: 'Retrieve Data Before Initialization', diagnostic: 'Call to GetValue was made before the SCO was initialized.' },
  123: { errorString: 'Retrieve Data After Termination', diagnostic: 'Call to GetValue was made after the SCO was terminated.' },
  132: { errorString: 'Store Data Before Initialization', diagnostic: 'Call to SetValue was made before the SCO was initialized.' },
  133: { errorString: 'Store Data After Termination', diagnostic: 'Call to SetValue was made after the SCO was terminated.' },
  142: { errorString: 'Commit Before Initialization', diagnostic: 'Call to Commit was made before the SCO was initialized.' },
  143: { errorString: 'Commit After Termination', diagnostic: 'Call to Commit was made after the SCO was terminated.' },
  201: { errorString: 'General Argument Error', diagnostic: 'An invalid argument was passed to an API call.' },
  301: { errorString: 'General Get Failure', diagnostic: 'Indicates a failed GetValue call where no other specific error code applies.' },
  351: { errorString: 'General Set Failure', diagnostic: 'Indicates a failed SetValue call where no other specific error code applies.' },
  391: { errorString: 'General Commit Failure', diagnostic: 'Indicates a failed Commit call where no other specific error code applies.' },
  401: { errorString: 'Undefined Data Model Element', diagnostic: 'The data model element name passed is not a valid SCORM data model element.' },
  402: { errorString: 'Unimplemented Data Model Element', diagnostic: 'The data model element is valid but was not implemented by this LMS.' },
  403: { errorString: 'Data Model Element Value Not Initialized', diagnostic: 'The data model element has not been set and has no default value.' },
  404: { errorString: 'Data Model Element Is Read Only', diagnostic: 'SetValue was called on a data model element that can only be read.' },
  405: { errorString: 'Data Model Element Is Write Only', diagnostic: 'GetValue was called on a data model element that can only be written to.' },
  406: { errorString: 'Data Model Element Type Mismatch', diagnostic: 'SetValue was called with a value inconsistent with the element data type.' },
  407: { errorString: 'Data Model Element Value Out Of Range', diagnostic: 'The value passed to SetValue is outside the range permitted for the element.' },
  408: { errorString: 'Data Model Dependency Not Established', diagnostic: 'A dependent data model element was not set before this element.' },
}
