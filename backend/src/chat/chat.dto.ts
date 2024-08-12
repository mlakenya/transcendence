import { IsNotEmpty, IsOptional } from "class-validator";

export class ChatDto {
	@IsNotEmpty()
	readonly name: string;

	@IsNotEmpty()
	readonly private: boolean;

	@IsOptional()
	readonly password?: string;

	@IsNotEmpty()
	readonly owner: string;	// userName

	@IsNotEmpty()
	readonly group: boolean;
}