//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'studentclass_create_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class StudentclassCreateInput {
  /// Returns a new [StudentclassCreateInput] instance.
  StudentclassCreateInput({

     this.classId,

     this.expiry,

     this.userId,
  });

  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



      /// \"YYYY-MM-DD\"
  @JsonKey(
    
    name: r'expiry',
    required: false,
    includeIfNull: false,
  )


  final String? expiry;



  @JsonKey(
    
    name: r'user_id',
    required: false,
    includeIfNull: false,
  )


  final int? userId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is StudentclassCreateInput &&
      other.classId == classId &&
      other.expiry == expiry &&
      other.userId == userId;

    @override
    int get hashCode =>
        classId.hashCode +
        expiry.hashCode +
        userId.hashCode;

  factory StudentclassCreateInput.fromJson(Map<String, dynamic> json) => _$StudentclassCreateInputFromJson(json);

  Map<String, dynamic> toJson() => _$StudentclassCreateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

