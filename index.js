/**
 * Influx stream processor.
 */
module.exports = class Influx {

    /**
     * Creates a new Influx instance.
     * 
     * @param {NodeJS.ReadStream} stream 
     * @param {Object} options
     */
    constructor(stream, options) {
        this.rest = '';
        this.buf = [];
        this.eof = false;

        // Merge options
        this.options = {
            charset: 'utf-8',
            newline: '\n',
            trim: false,
            chunkSize: 512,
            callback: null,
            ...(options || {}),
        };

        stream.on('end', () => {

            // Process the rest
            this._processLine(this.rest);

            // Set end of file flag
            this.eof = true;
        });

        stream.on('readable', () => {
            let chunk;

            // Process chunks till there's nothing left
            while ((chunk = stream.read(this.options.chunkSize)) !== null) {
                this._processChunk(chunk);
            }
        });
    }

    /**
     * Reads the next line, or `undefined` if the buffer is empty.
     * This does not block, but also does not indicate EOF.
     * 
     * @returns {string|undefined}
     */
    next() {
        return this.buf.shift();
    }

    nextAsync() {

        // Define limits
        const maxSpinCount = 4096;
        const maxTimeout = 32;

        return new Promise(resolve => {

            // Initialize state
            let spinCount = 0;
            let timeout = 1;

            // Spin until
            // - a line arrives in the buffer
            // - or EOF happens
            // - or spin count > maxSpinCount
            while (this.buf.length == 0 && !this.eof && ++spinCount < maxSpinCount) {
                // spin
            }

            // Lines in buffer
            if (this.buf.length != 0) {
                return resolve(this.next());
            }

            // EOF
            if (this.eof) {
                return resolve(null);
            }

            // Polling function
            const fn = () => {

                // Lines in buffer
                if (this.buf.length != 0) {
                    return resolve(this.next());
                }

                // EOF
                else if (this.eof) {
                    return resolve(null);
                }

                // Increase timeout
                timeout = Math.min(maxTimeout, timeout * 2);

                // Defer next check
                setTimeout(fn, timeout);
            }

            // Defer next check
            setTimeout(fn, timeout);
        });
    }

    _processLine(_line) {
        let line = this.options.trim ? _line.trim() : _line;
        if (this.options.callback !== null) {
            this.options.callback(line);
        } else {
            this.buf.push(line);
        }
    }

    _processChunk(chunk) {

        // Process input
        let data = this.buf + chunk.toString(this.options.charset);
        let lines = data.split(this.options.newline);

        // Iterate over all lines except for the last one
        while (lines.length > 1) {

            // Process the line
            let line = lines.shift();
            this._processLine(line);
        }

        // Remember the rest
        this.rest = lines.shift();
    }

    /**
     * Creates a new Influx instance from stdin.
     * 
     * @param {Object} options
     * 
     * @returns {Influx}
     */
    static stdin(options) {
        return new Influx(process.stdin, options);
    }

    /**
     * Creates a new Influx instance from a stream.
     * 
     * @param {NodeJS.ReadStream} stream
     * @param {Object} options
     * 
     * @returns {Influx}
     */
    static open(stream, options) {
        return new Influx(stream, options);
    }
}