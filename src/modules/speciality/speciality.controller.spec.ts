import { Test, TestingModule } from '@nestjs/testing';
import { SpecialityController } from './speciality.controller';

describe('SpecialityController', () => {
  let controller: SpecialityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialityController],
    }).compile();

    controller = module.get<SpecialityController>(SpecialityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
