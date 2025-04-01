import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPackage } from './subscription-package.entity';

@Injectable()
export class SubscriptionPackageService {
  private readonly logger = new Logger(SubscriptionPackageService.name);

  constructor(
    @InjectRepository(SubscriptionPackage)
    private readonly packageRepository: Repository<SubscriptionPackage>,
  ) {
    // Ensure default packages exist when service starts
    this.ensureDefaultPackages();
  }

  private async ensureDefaultPackages() {
    const count = await this.packageRepository.count();
    if (count === 0) {
      this.logger.log('Creating default subscription packages');

      // Create standard package
      await this.packageRepository.save({
        name: 'Standard',
        description: 'Gói cơ bản cho người dùng',
        price: 0,
        duration_days: 0,
        boost_slots: 0,
        is_premium: false,
        is_active: true,
      });

      // Create premium package
      await this.packageRepository.save({
        name: 'Premium',
        description: 'Gói premium cho người dùng',
        price: 99000,
        duration_days: 30,
        boost_slots: 0,
        is_premium: true,
        is_active: true,
      });

      // Create pro package
      await this.packageRepository.save({
        name: 'Pro',
        description: 'Gói pro với đặc quyền đẩy tin',
        price: 149000,
        duration_days: 30,
        boost_slots: 10,
        is_premium: true,
        is_active: true,
      });
    }
  }

  async getAllPackages() {
    return this.packageRepository.find({
      where: { is_active: true },
      order: { price: 'ASC' },
    });
  }

  async getPackageById(id: number) {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return pkg;
  }

  async createPackage(packageData: Partial<SubscriptionPackage>) {
    const newPackage = this.packageRepository.create(packageData);
    return this.packageRepository.save(newPackage);
  }

  async updatePackage(id: number, packageData: Partial<SubscriptionPackage>) {
    const pkg = await this.getPackageById(id);
    Object.assign(pkg, packageData);
    return this.packageRepository.save(pkg);
  }

  async deactivatePackage(id: number) {
    const pkg = await this.getPackageById(id);
    pkg.is_active = false;
    return this.packageRepository.save(pkg);
  }
}
