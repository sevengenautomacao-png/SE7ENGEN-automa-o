export class PixHelper {
    constructor(key, name, city) {
        this.key = key;
        this.name = this.normalize(name).substring(0, 25);
        this.city = this.normalize(city).substring(0, 15);
    }

    normalize(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    }

    formatField(id, value) {
        const valStr = value.toString();
        const len = valStr.length.toString().padStart(2, '0');
        return `${id}${len}${valStr}`;
    }

    generatePayload(amount) {
        const amtStr = amount.toFixed(2);

        let payload = [
            this.formatField('00', '01'), // Payload Format
            this.formatField('26', [
                this.formatField('00', 'br.gov.bcb.pix'),
                this.formatField('01', this.key)
            ].join('')),
            this.formatField('52', '0000'), // Merchant Category
            this.formatField('53', '986'),  // Currency BRL
            this.formatField('54', amtStr), // Amount
            this.formatField('58', 'BR'),   // Country
            this.formatField('59', this.name),
            this.formatField('60', this.city),
            this.formatField('62', this.formatField('05', '***')) // TxID
        ].join('');

        payload += '6304'; // Add CRC ID and length

        const crc = this.computeCRC(payload);
        return payload + crc;
    }

    computeCRC(payload) {
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }
}
