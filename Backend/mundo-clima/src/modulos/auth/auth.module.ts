import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtEstrategia } from './estrategias/jwt.estrategia';
import { UsuariosModule } from '../usuarios/usuarios.module';

/**
 * Módulo de Autenticación JWT del sistema
 */
@Module({
  imports: [
    UsuariosModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d', 
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtEstrategia],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule { }
