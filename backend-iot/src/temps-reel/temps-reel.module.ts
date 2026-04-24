import { Module, Global } from '@nestjs/common';
import { TempsReelGateway } from './temps-reel.gateway';

@Global()
@Module({
  providers: [TempsReelGateway],
  exports: [TempsReelGateway],
})
export class TempsReelModule {}
