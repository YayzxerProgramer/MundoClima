import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marca } from './entidades/marca.entity';
import { MarcasService } from './marcas.service';
import { MarcasController } from './marcas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Marca])],
  providers: [MarcasService],
  controllers: [MarcasController],
  exports: [MarcasService, TypeOrmModule],
})
export class MarcasModule {}
