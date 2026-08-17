import { AuthTextField } from '@/components/auth-text-field';
import {
  BRAZILIAN_MOBILE_PHONE_MASK,
  BRAZILIAN_MOBILE_PHONE_MASK_LENGTH,
  formatBrazilianMobilePhone,
} from '@/utils/phone-mask';
import type { ComponentProps } from 'react';

type PhoneTextFieldProps = Omit<
  ComponentProps<typeof AuthTextField>,
  'keyboardType' | 'placeholder' | 'maxLength' | 'onChangeText'
> & {
  onChangeText: (value: string) => void;
};

export function PhoneTextField({ value, onChangeText, ...props }: PhoneTextFieldProps) {
  function handleChangeText(text: string) {
    onChangeText(formatBrazilianMobilePhone(text));
  }

  return (
    <AuthTextField
      {...props}
      value={value}
      onChangeText={handleChangeText}
      keyboardType="phone-pad"
      placeholder={BRAZILIAN_MOBILE_PHONE_MASK}
      maxLength={BRAZILIAN_MOBILE_PHONE_MASK_LENGTH}
    />
  );
}
