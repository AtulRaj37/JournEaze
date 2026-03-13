import { Global, Module } from '@nestjs/common';
import { TripGateway } from './trip.gateway';

@Global()
@Module({
  providers: [TripGateway],
  exports: [TripGateway],
})
export class GatewayModule {}
