import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card])],
  controllers: [],
  providers: [CardsService],
  exports: [TypeOrmModule],
})
export class CardsModule { }
