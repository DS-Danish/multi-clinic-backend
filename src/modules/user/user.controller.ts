import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // CREATE USER
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  // GET ALL USERS
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  // ✅ NEW ROUTE: GET ALL PATIENT USERS ONLY
  @Get('patients')
  async findAllPatients() {
    return this.userService.findAllPatients();
  }

  // GET USER BY ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  // UPDATE USER
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  // DELETE USER
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
