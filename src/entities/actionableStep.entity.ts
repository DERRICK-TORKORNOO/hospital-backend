import { 
    Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne, 
    Column, 
    OneToMany, 
    CreateDateColumn, 
    Index 
} from "typeorm";
import { DoctorNote } from "./doctorNotes.entity";
import { Reminder } from "./reminder.entity";
import { ActionableStepType } from "../enums/actionableStepType.enum"; 

@Entity("actionable_steps") 
@Index(["note"])  // ✅ Keep only one index on note
@Index(["createdAt"]) // ✅ Keep at class level, removed from column
export class ActionableStep {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => DoctorNote, (note) => note.actionableSteps)
    note: DoctorNote; // ❌ Removed `@Index()`

    @Column({ type: "enum", enum: ActionableStepType })
    type: ActionableStepType; // ❌ Removed `@Index()`

    @Column()
    description: string;

    @CreateDateColumn()
    createdAt: Date; // ❌ Removed `@Index()`, it's already indexed at the class level

    @OneToMany(() => Reminder, (reminder) => reminder.step)
    reminders: Reminder[];
}
