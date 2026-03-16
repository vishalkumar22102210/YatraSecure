import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { JoinRequestsModule } from './join-requests/join-requests.module';
import { MembersModule } from './members/members.module';
import { WalletModule } from './wallet/wallet.module';
import { ChatModule } from './chat/chat.module';
import { EmailModule } from './email/email.module';
import { LoggerModule } from './common/logger/logger.module';
import { ExpensesModule } from './expenses/expenses.module';
import { UploadModule } from './upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SocialModule } from './social/social.module';
import { MatchmakingModule } from './common/matchmaking/matchmaking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI') || 'mongodb://localhost:27017/yatrasecure',
        // Resilience: don't crash the app if MongoDB is down
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 5000,
        retryAttempts: 1,
        retryDelay: 1000,
        lazyConnection: true,
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    LoggerModule,
    PrismaModule,

    AuthModule,
    UsersModule,
    TripsModule,
    JoinRequestsModule,
    MembersModule,

    WalletModule,
    ExpensesModule,
    ChatModule,

    EmailModule,
    UploadModule,

    NotificationsModule,
    SocialModule,
    MatchmakingModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}