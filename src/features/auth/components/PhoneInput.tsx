import React, { useState } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

const countryCodes = [
  { code: '+20', country: 'Egypt', flag: '🇪🇬', length: 10 },
  { code: '+1', country: 'USA', flag: '🇺🇸', length: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', length: 10 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9 },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', length: 9 },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}) => {
  const [countryCode, setCountryCode] = useState('+20');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Parse initial value if provided
  React.useEffect(() => {
    if (value && value.startsWith('+')) {
      const matchedCountry = countryCodes.find(c => value.startsWith(c.code));
      if (matchedCountry) {
        setCountryCode(matchedCountry.code);
        setPhoneNumber(value.substring(matchedCountry.code.length));
      }
    }
  }, []);

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    onChange(newCode + phoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/\D/g, ''); // Only digits
    setPhoneNumber(newNumber);
    onChange(countryCode + newNumber);
  };

  const formatPhoneDisplay = (num: string): string => {
    if (!num) return '';
    // Format based on length (Egypt: 10 digits -> 0XX XXXX XXXX)
    if (num.length >= 10) {
      return `${num.substring(0, 3)} ${num.substring(3, 7)} ${num.substring(7, 11)}`;
    } else if (num.length >= 7) {
      return `${num.substring(0, 3)} ${num.substring(3, 7)} ${num.substring(7)}`;
    } else if (num.length >= 3) {
      return `${num.substring(0, 3)} ${num.substring(3)}`;
    }
    return num;
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number {required && <span className="text-red-600">*</span>}
      </label>
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <select
          value={countryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="w-32 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {countryCodes.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={disabled}
            placeholder={`10 digits (e.g., 1234567890)`}
            maxLength={selectedCountry?.length || 10}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
      </div>

      {/* Display formatted phone */}
      {phoneNumber && !error && (
        <p className="mt-2 text-sm text-gray-600">
          Full number: <span className="font-mono font-semibold">{countryCode} {formatPhoneDisplay(phoneNumber)}</span>
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Helper text */}
      {!error && !phoneNumber && (
        <p className="mt-1 text-xs text-gray-500">
          We'll send you a verification code via SMS
        </p>
      )}
    </div>
  );
};

