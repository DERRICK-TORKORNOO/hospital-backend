import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from "typeorm";
import { DoctorPatient } from "./doctorPatient.entity";
import { DoctorNote } from "./doctorNotes.entity";
import { UserRole } from "../enums/userRole.enum"; // Importing the enum

@Entity("users") 
@Index(["email"]) // ✅ Keep at class level (no need for @Index() on the property)
@Index(["role"])  // ✅ Keep at class level instead of `@Index()` on the property
export class User {
    @PrimaryGeneratedColumn("uuid") 
    id!: string; 

    @Column()
    name!: string;

    @Column({ unique: true }) // ✅ Unique constraint already enforced here
    email!: string;

    @Column()
    password!: string;

    @Column({ type: "enum", enum: UserRole })
    role!: UserRole; // ❌ Removed `@Index()`, already indexed at class level

    @CreateDateColumn()
    createdAt!: Date; // ❌ Removed `@Index()` unless necessary

    @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.patient)
    assignedDoctors!: DoctorPatient[];

    @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.doctor)
    assignedPatients!: DoctorPatient[];

    @OneToMany(() => DoctorNote, (doctorNote) => doctorNote.doctor)
    doctorNotes!: DoctorNote[];
}
