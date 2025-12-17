# Encryption Setup Guide

## Overview

This application implements **AES-256-GCM encryption** for data at rest and in transit:

- ✅ **Data Encryption**: Sensitive user fields (email, phone, 2FA secrets)
- ✅ **File Encryption**: Uploaded files (avatars, documents)
- ✅ **HTTPS**: Data in transit (production)
- ✅ **Password Hashing**: Bcrypt with 10 rounds

## Environment Setup

### Generate Encryption Keys

**IMPORTANT**: Generate unique encryption keys for your environment:

```bash
# Generate data encryption key
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate file encryption key
node -e "console.log('FILE_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Add to Environment Variables

Create a `.env` file in the backend directory:

```env
# Encryption Keys (REQUIRED for production)
ENCRYPTION_KEY=your_64_character_hex_string_here
FILE_ENCRYPTION_KEY=your_64_character_hex_string_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Database
DATABASE_URL=postgresql://user:password@host:port/database
```

⚠️ **WARNING**: Never commit these keys to version control!

## Encrypted Data

### User Fields

The following user fields are automatically encrypted at rest:

- `email` - User email address
- `phone` - Phone number
- `twoFactorSecret` - 2FA secret key

### Files

All uploaded files are encrypted:

- Avatars (profile pictures)
- Document uploads (if implemented)

## Encryption Specifications

### Data Encryption (AES-256-GCM)

- **Algorithm**: AES-256-GCM (Authenticated Encryption)
- **Key Size**: 256 bits (32 bytes)
- **IV**: 16 bytes (random per encryption)
- **Auth Tag**: 16 bytes (prevents tampering)
- **Format**: `base64(iv):base64(authTag):base64(encryptedData)`

### File Encryption

- **Algorithm**: AES-256-GCM
- **Separate Key**: Uses FILE_ENCRYPTION_KEY
- **Metadata**: Stored in `.meta` files alongside encrypted files
- **Streaming**: Files encrypted/decrypted on-the-fly for efficiency

### Password Hashing

- **Algorithm**: Bcrypt
- **Rounds**: 10 (2^10 = 1024 iterations)
- **Salt**: Automatically generated per password

## Usage Examples

### Encrypting Data Programmatically

```typescript
import { DataEncryption } from './encryption';

// Encrypt a string
const encrypted = DataEncryption.encrypt("sensitive data");

// Decrypt a string
const decrypted = DataEncryption.decrypt(encrypted);

// Encrypt object fields
const user = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890"
};

const encryptedUser = DataEncryption.encryptFields(user, ['email', 'phone']);
const decryptedUser = DataEncryption.decryptFields(encryptedUser, ['email', 'phone']);
```

### Encrypting Files

```typescript
import { FileEncryption } from './encryption';

// Encrypt file in place
await FileEncryption.encryptFileInPlace('/path/to/file.jpg');

// Decrypt file in place
await FileEncryption.decryptFileInPlace('/path/to/file.jpg');

// Check if file is encrypted
const isEncrypted = FileEncryption.isFileEncrypted('/path/to/file.jpg');
```

## Security Best Practices

### Key Management

1. **Generate Strong Keys**: Use cryptographically secure random keys
2. **Separate Keys**: Use different keys for data and files
3. **Key Rotation**: Plan to rotate keys periodically
4. **Secure Storage**: Store keys in environment variables or secrets manager
5. **Backup Keys**: Securely backup keys (encrypted) to prevent data loss

### Production Deployment

1. ✅ Set `ENCRYPTION_KEY` and `FILE_ENCRYPTION_KEY` in environment
2. ✅ Enable HTTPS (already configured)
3. ✅ Use a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
4. ✅ Implement key rotation strategy
5. ✅ Monitor for failed decryption attempts
6. ✅ Backup encrypted data AND keys separately

### Key Rotation Strategy

When rotating encryption keys:

1. Generate new keys
2. Decrypt data with old keys
3. Re-encrypt with new keys
4. Update environment variables
5. Restart application
6. Securely destroy old keys

**Example key rotation script** (pseudocode):

```typescript
// 1. Load both old and new keys
const oldKey = process.env.OLD_ENCRYPTION_KEY;
const newKey = process.env.NEW_ENCRYPTION_KEY;

// 2. For each encrypted field in database:
//    - Decrypt with old key
//    - Re-encrypt with new key
//    - Update record

// 3. Update environment to use new key only
// 4. Remove old key from environment
```

## Compliance

This encryption setup helps meet compliance requirements:

- ✅ **GDPR**: Personal data encrypted at rest
- ✅ **HIPAA**: PHI (Protected Health Information) encrypted
- ✅ **PCI DSS**: Cardholder data protection (if handling payments)
- ✅ **SOC 2**: Data security controls

## Troubleshooting

### Keys Not Set Warning

```
⚠️  WARNING: ENCRYPTION_KEY and FILE_ENCRYPTION_KEY not set in environment!
⚠️  Using default keys - NOT SECURE FOR PRODUCTION!
```

**Solution**: Set encryption keys in your environment variables.

### Decryption Failed

**Possible Causes**:
1. Wrong encryption key
2. Corrupted data
3. Data encrypted with different key

**Solution**: Ensure you're using the correct key that was used for encryption.

### File Serving Errors

**Issue**: Encrypted files not displaying

**Solution**: Check that file decryption middleware is active and metadata files exist.

## Performance Considerations

- **Encryption Overhead**: ~5-10ms per field encryption
- **File Encryption**: Streaming for large files (minimal memory impact)
- **Database Impact**: Encrypted fields slightly larger (~33% for base64)
- **CPU Usage**: AES-256-GCM is hardware-accelerated on modern CPUs

## Monitoring

Monitor these metrics in production:

1. **Encryption Failures**: Log when encryption/decryption fails
2. **Key Access**: Audit key usage
3. **Performance**: Track encryption operation times
4. **File Access**: Monitor encrypted file access patterns

## Future Enhancements

Consider implementing:

1. **Key Management Service (KMS)**: AWS KMS, Azure Key Vault
2. **Envelope Encryption**: Master key + data encryption keys
3. **Client-Side Encryption**: Encrypt before sending to server
4. **Homomorphic Encryption**: Query encrypted data without decryption
5. **Hardware Security Modules (HSM)**: For key storage

## Support

For security issues or questions about encryption:

1. Review this documentation
2. Check encryption.ts source code
3. Contact security team
4. Never share encryption keys

---

**Last Updated**: December 2025
