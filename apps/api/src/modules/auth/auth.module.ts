import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EnvService } from '../../shared/env/env.service';

import { REFRESH_JWT_SERVICE } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthPasswordCryptoService } from './auth-password-crypto.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthPasswordCryptoService,
    JwtStrategy,
    {
      provide: REFRESH_JWT_SERVICE,
      inject: [EnvService],
      useFactory: (env: EnvService): JwtService => {
        return new JwtService({ secret: env.jwtRefreshSecret });
      },
    },
  ],
  exports: [AuthService, AuthPasswordCryptoService],
})
export class AuthModule {}
