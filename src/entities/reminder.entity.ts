import { 
    Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne, 
    Column, 
    CreateDateColumn, 
    Index 
} from "typeorm";
import { ActionableStep } from "./actionableStep.entity";

@Entity("reminders") 
@Index(["scheduleTime"]) // ✅ Keep at class level
@Index(["completed"]) // ✅ Keep at class level
export class Reminder {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ActionableStep, (step) => step.reminders)
    step: ActionableStep;

    @Column()
    scheduleTime: Date; // ❌ Removed `@Index()`, already indexed at class level

    @Column({ default: false })
    completed: boolean; // ❌ Removed `@Index()`, already indexed at class level

    @CreateDateColumn()
    createdAt: Date; // ❌ Removed `@Index()`, unless necessary
}
