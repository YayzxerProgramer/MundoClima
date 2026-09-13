import { Controller, Post } from '@nestjs/common';
import { SemillaService } from './semilla.service';

@Controller('semilla')
export class SemillaController {
  constructor(private readonly servicioSemilla: SemillaService) {}

  @Post()
  async ejecutarSemilla() {
    return this.servicioSemilla.ejecutarSemilla();
  }
}
