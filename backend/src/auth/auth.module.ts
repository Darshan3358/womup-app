import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { EmailService } from './email.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OtpVerification, OtpVerificationSchema } from './schemas/otp.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { CoinTransaction, CoinTransactionSchema } from '../coins/schemas/coin-transaction.schema';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OtpVerification.name, schema: OtpVerificationSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService, JwtStrategy, EmailService, PassportModule],
})
export class AuthModule {}
