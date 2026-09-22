import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ACCESS_SECRET',
        'wormup_super_secure_access_token_secret_2026',
      ),
    });
  }

  async validate(payload: any) {
    // 1. Dark Store Operator session (Shared store credentials)
    if (payload.role === 'STORE_OPERATOR' || payload.storeId) {
      const storeId = payload.storeId || payload.sub;
      const store = await this.storeModel.findById(storeId);
      if (!store || !store.isActive) {
        throw new UnauthorizedException('Dark Store is deactivated or invalid');
      }
      return {
        id: store._id.toString(),
        sub: store._id.toString(),
        storeId: store._id.toString(),
        storeCode: store.code,
        storeName: store.name,
        role: 'STORE_OPERATOR',
        name: store.name,
        assignedStoreId: store._id.toString(),
      };
    }

    // 2. Standard customer / rider / staff user
    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer exists or is deactivated');
    }
    return {
      id: user._id.toString(),
      phone: user.phone,
      role: user.role,
      name: user.name,
      assignedStoreId: user.assignedStoreId?.toString(),
    };
  }
}
