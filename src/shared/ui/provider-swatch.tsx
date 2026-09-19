import { providerSwatchClass } from '@/shared/provider-tone';

type ProviderSwatchProps = {
  providerKey: string;
  className?: string;
};

/** Color dot tied to a provider direction. */
export function ProviderSwatch({ providerKey, className = 'size-1.5' }: ProviderSwatchProps) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${providerSwatchClass(providerKey)} ${className}`}
      aria-hidden
    />
  );
}
